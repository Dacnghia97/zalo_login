import React from 'react';
import { Monitor, MapPin, Clock, Star } from 'lucide-react';

const programs = [
  {
    id: 'online',
    icon: Monitor,
    title: 'Học Online',
    description: 'Học mọi lúc mọi nơi với giáo trình chuyên nghiệp từ các chuyên gia. Hệ thống bài học video trực quan kèm đề cương thực hành thực tế.',
    linkText: 'Xem khóa online →'
  },
  {
    id: 'offline',
    icon: MapPin,
    title: 'Học Offline',
    description: 'Lớp học trực tiếp tại Hà Nội, TP.HCM và Đà Nẵng. Tương tác trực tiếp và giải quyết bài toán của doanh nghiệp bạn ngay tại lớp.',
    linkText: 'Xem lịch khai giảng →'
  },
  {
    id: 'challenge',
    icon: Clock,
    title: 'Khóa Thử Thách',
    description: 'Thử thách bản thân với các chương trình 7 ngày, 14 ngày, 21 ngày hoặc 30 ngày. Cam kết hoàn tiền 100% nếu không đạt mục tiêu đầu ra.',
    linkText: 'Tham gia thử thách →'
  },
  {
    id: 'next-marketer',
    icon: Star,
    title: 'Next Marketer',
    description: 'Lộ trình đào tạo toàn diện nâng tầm kỹ năng cho Marketer mới ra trường. Học chuyên sâu giải pháp, tool tự động, tư duy phân tích.',
    linkText: 'Chi tiết chương trình →'
  }
];

export const ProgramCards = () => {
  return (
    <section className="programs-section">
      <h2 className="section-title">
        Khám Phá Các Chương Trình Tại <span className="gradient-text">Bot.vn</span>
      </h2>
      <div className="programs-grid">
        {programs.map((prog) => {
          const IconComp = prog.icon;
          return (
            <div key={prog.id} className="program-card">
              <div>
                <div className="card-icon-wrapper">
                  <IconComp size={24} />
                </div>
                <h3 className="card-title">{prog.title}</h3>
                <p className="card-description">{prog.description}</p>
              </div>
              <a href={`#${prog.id}`} className="card-link">
                {prog.linkText}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
};
